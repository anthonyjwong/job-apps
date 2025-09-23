"""refactored db

Revision ID: 4bcd95243d53
Revises: d47fc60ea65f
Create Date: 2025-09-23 03:13:17.113902

"""

import uuid
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "4bcd95243d53"
down_revision: Union[str, Sequence[str], None] = "d47fc60ea65f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema with data backfill and safe constraints."""
    # 1) Create new table with safe server defaults
    op.create_table(
        "application_forms",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("application_id", sa.UUID(), nullable=False),
        sa.Column("fields", sa.JSON(), nullable=True),
        sa.Column("state", sa.String(), nullable=False, server_default=sa.text("'created'")),
        sa.Column("prepare_claim", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["application_id"], ["applications.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # 2) Add new columns as nullable or with server defaults to avoid violating existing rows
    op.add_column("applications", sa.Column("form_id", sa.UUID(), nullable=True))
    op.add_column(
        "applications",
        sa.Column("status", sa.String(), nullable=True, server_default=sa.text("'started'")),
    )
    op.add_column("applications", sa.Column("submitted_at", sa.DateTime(), nullable=True))
    op.create_foreign_key(None, "applications", "application_forms", ["form_id"], ["id"])

    op.add_column("jobs", sa.Column("type", sa.String(), nullable=True))
    op.add_column(
        "jobs", sa.Column("state", sa.String(), nullable=True, server_default=sa.text("'pending'"))
    )
    op.add_column("jobs", sa.Column("classification", sa.String(), nullable=True))
    op.add_column("jobs", sa.Column("action", sa.String(), nullable=True))
    op.add_column(
        "jobs",
        sa.Column("manually_created", sa.Boolean(), nullable=True, server_default=sa.text("false")),
    )

    # 3) Data backfill
    bind = op.get_bind()

    # 3a) Create application_forms from legacy application columns when present
    apps = list(
        bind.execute(
            sa.text(
                """
                SELECT id, fields, prepare_claim, prepared, approved, discarded, created_at, updated_at
                FROM applications
                """
            )
        ).mappings()
    )

    for a in apps:
        has_form = (
            a.get("fields") is not None
            or bool(a.get("prepared"))
            or bool(a.get("approved"))
            or bool(a.get("discarded"))
        )
        if not has_form:
            continue

        form_id = str(uuid.uuid4())
        if a.get("discarded"):
            form_state = "discarded"
        elif a.get("approved"):
            form_state = "approved"
        elif a.get("prepared"):
            form_state = "prepared"
        elif a.get("fields") is not None:
            form_state = "scraped"
        else:
            form_state = "created"

        insert_stmt = sa.text(
            """
            INSERT INTO application_forms (id, application_id, fields, state, prepare_claim, created_at, updated_at)
            VALUES (:id, :application_id, :fields, :state, :prepare_claim, :created_at, :updated_at)
            """
        ).bindparams(
            sa.bindparam("id"),
            sa.bindparam("application_id"),
            sa.bindparam("fields", type_=postgresql.JSON),
            sa.bindparam("state"),
            sa.bindparam("prepare_claim", type_=sa.Boolean),
            sa.bindparam("created_at"),
            sa.bindparam("updated_at"),
        )

        bind.execute(
            insert_stmt,
            {
                "id": form_id,
                "application_id": a["id"],
                "fields": a.get("fields"),
                "state": form_state,
                "prepare_claim": bool(a.get("prepare_claim")),
                "created_at": a.get("created_at"),
                "updated_at": a.get("updated_at"),
            },
        )

        bind.execute(
            sa.text("UPDATE applications SET form_id = :fid WHERE id = :aid"),
            {"fid": form_id, "aid": a["id"]},
        )

    # 3b) Backfill applications.status and submitted_at with precedence
    # Highest precedence first; leave others as-is
    bind.execute(
        sa.text(
            "UPDATE applications SET status = 'rejected' WHERE COALESCE(rejected, false) = true"
        )
    )
    bind.execute(
        sa.text(
            "UPDATE applications SET status = 'interview' WHERE COALESCE(interview, false) = true AND status <> 'rejected'"
        )
    )
    bind.execute(
        sa.text(
            "UPDATE applications SET status = 'assessment' WHERE COALESCE(assessment, false) = true AND status NOT IN ('rejected','interview')"
        )
    )
    bind.execute(
        sa.text(
            "UPDATE applications SET status = 'acknowledged' WHERE COALESCE(acknowledged, false) = true AND status NOT IN ('rejected','interview','assessment')"
        )
    )
    bind.execute(
        sa.text(
            "UPDATE applications SET status = 'submitted' WHERE COALESCE(submitted, false) = true AND status NOT IN ('rejected','interview','assessment','acknowledged')"
        )
    )
    # submitted_at best-effort from updated_at if not already set
    bind.execute(
        sa.text(
            "UPDATE applications SET submitted_at = COALESCE(submitted_at, updated_at) WHERE COALESCE(submitted, false) = true"
        )
    )
    # Ready only when prepared AND approved, and still at started/null
    bind.execute(
        sa.text(
            """
            UPDATE applications
            SET status = 'ready'
            WHERE COALESCE(prepared, false) = true
              AND COALESCE(approved, false) = true
              AND (status IS NULL OR status = 'started')
            """
        )
    )
    # Default any remaining NULL to started
    bind.execute(sa.text("UPDATE applications SET status = 'started' WHERE status IS NULL"))

    # 3c) Backfill jobs columns from legacy fields
    # type from job_type
    bind.execute(sa.text("UPDATE jobs SET type = job_type WHERE job_type IS NOT NULL"))
    # manually_created from manual
    bind.execute(sa.text("UPDATE jobs SET manually_created = COALESCE(manual, false)"))
    # classification/action from review JSON (Postgres JSON operator)
    bind.execute(
        sa.text(
            "UPDATE jobs SET classification = review->>'classification' WHERE review IS NOT NULL"
        )
    )
    bind.execute(sa.text("UPDATE jobs SET action = review->>'action' WHERE review IS NOT NULL"))
    # state precedence
    bind.execute(
        sa.text(
            """
            UPDATE jobs
            SET state = CASE
                WHEN COALESCE(expired, false) = true THEN 'expired'
                WHEN COALESCE(discarded, false) = true THEN 'discarded'
                WHEN COALESCE(approved, false) = true THEN 'approved'
                WHEN COALESCE(reviewed, false) = true THEN 'reviewed'
                ELSE 'pending'
            END
            """
        )
    )

    # 4) Enforce NOT NULL where required and drop server defaults
    op.alter_column(
        "applications", "status", existing_type=sa.String(), nullable=False, server_default=None
    )
    op.alter_column("jobs", "state", existing_type=sa.String(), nullable=False, server_default=None)
    op.alter_column(
        "jobs", "manually_created", existing_type=sa.Boolean(), nullable=False, server_default=None
    )

    # 5) Drop legacy columns now that data is migrated
    op.drop_column("applications", "interview")
    op.drop_column("applications", "prepared")
    op.drop_column("applications", "prepare_claim")
    op.drop_column("applications", "fields")
    op.drop_column("applications", "discarded")
    op.drop_column("applications", "approved")
    op.drop_column("applications", "rejected")
    op.drop_column("applications", "acknowledged")
    op.drop_column("applications", "submitted")
    op.drop_column("applications", "assessment")

    op.drop_column("jobs", "manual")
    op.drop_column("jobs", "review")
    op.drop_column("jobs", "discarded")
    op.drop_column("jobs", "expired")
    op.drop_column("jobs", "approved")
    op.drop_column("jobs", "job_type")
    op.drop_column("jobs", "reviewed")
    # End upgrade


def downgrade() -> None:
    """Downgrade schema with data backfill to legacy columns."""
    bind = op.get_bind()

    # 1) Recreate legacy application columns as nullable, then backfill
    op.add_column("applications", sa.Column("assessment", sa.BOOLEAN(), nullable=True))
    op.add_column("applications", sa.Column("submitted", sa.BOOLEAN(), nullable=True))
    op.add_column("applications", sa.Column("acknowledged", sa.BOOLEAN(), nullable=True))
    op.add_column("applications", sa.Column("rejected", sa.BOOLEAN(), nullable=True))
    op.add_column("applications", sa.Column("approved", sa.BOOLEAN(), nullable=True))
    op.add_column("applications", sa.Column("discarded", sa.BOOLEAN(), nullable=True))
    op.add_column(
        "applications", sa.Column("fields", postgresql.JSON(astext_type=sa.Text()), nullable=True)
    )
    op.add_column("applications", sa.Column("prepare_claim", sa.BOOLEAN(), nullable=True))
    op.add_column("applications", sa.Column("prepared", sa.BOOLEAN(), nullable=True))
    op.add_column("applications", sa.Column("interview", sa.BOOLEAN(), nullable=True))

    # Backfill application flags from status and application_forms
    # Reset all to false first where null
    bind.execute(sa.text("UPDATE applications SET assessment=false WHERE assessment IS NULL"))
    bind.execute(sa.text("UPDATE applications SET submitted=false WHERE submitted IS NULL"))
    bind.execute(sa.text("UPDATE applications SET acknowledged=false WHERE acknowledged IS NULL"))
    bind.execute(sa.text("UPDATE applications SET rejected=false WHERE rejected IS NULL"))
    bind.execute(sa.text("UPDATE applications SET approved=false WHERE approved IS NULL"))
    bind.execute(sa.text("UPDATE applications SET discarded=false WHERE discarded IS NULL"))
    bind.execute(sa.text("UPDATE applications SET interview=false WHERE interview IS NULL"))
    bind.execute(sa.text("UPDATE applications SET prepared=false WHERE prepared IS NULL"))
    bind.execute(sa.text("UPDATE applications SET prepare_claim=false WHERE prepare_claim IS NULL"))

    # Set flags based on status one-to-one
    bind.execute(sa.text("UPDATE applications SET rejected=true WHERE status='rejected'"))
    bind.execute(sa.text("UPDATE applications SET interview=true WHERE status='interview'"))
    bind.execute(sa.text("UPDATE applications SET assessment=true WHERE status='assessment'"))
    bind.execute(sa.text("UPDATE applications SET acknowledged=true WHERE status='acknowledged'"))
    bind.execute(sa.text("UPDATE applications SET submitted=true WHERE status='submitted'"))

    # Set prepared/approved/discarded and fields from application_forms
    bind.execute(
        sa.text(
            """
        UPDATE applications a
        SET prepared = true
        FROM application_forms f
        WHERE f.application_id = a.id AND f.state IN ('prepared','approved','discarded')
        """
        )
    )
    bind.execute(
        sa.text(
            """
        UPDATE applications a
        SET approved = true
        FROM application_forms f
        WHERE f.application_id = a.id AND f.state = 'approved'
        """
        )
    )
    bind.execute(
        sa.text(
            """
        UPDATE applications a
        SET discarded = true
        FROM application_forms f
        WHERE f.application_id = a.id AND f.state = 'discarded'
        """
        )
    )
    bind.execute(
        sa.text(
            """
        UPDATE applications a
        SET fields = f.fields,
            prepare_claim = COALESCE(f.prepare_claim,false)
        FROM application_forms f
        WHERE f.application_id = a.id
        """
        )
    )

    # Enforce NOT NULL on legacy application columns
    op.alter_column("applications", "assessment", existing_type=sa.Boolean(), nullable=False)
    op.alter_column("applications", "submitted", existing_type=sa.Boolean(), nullable=False)
    op.alter_column("applications", "acknowledged", existing_type=sa.Boolean(), nullable=False)
    op.alter_column("applications", "rejected", existing_type=sa.Boolean(), nullable=False)
    op.alter_column("applications", "approved", existing_type=sa.Boolean(), nullable=False)
    op.alter_column("applications", "discarded", existing_type=sa.Boolean(), nullable=False)
    op.alter_column("applications", "prepare_claim", existing_type=sa.Boolean(), nullable=False)
    op.alter_column("applications", "prepared", existing_type=sa.Boolean(), nullable=False)
    op.alter_column("applications", "interview", existing_type=sa.Boolean(), nullable=False)

    # 2) Recreate legacy job columns as nullable, then backfill
    op.add_column("jobs", sa.Column("reviewed", sa.BOOLEAN(), nullable=True))
    op.add_column("jobs", sa.Column("job_type", sa.VARCHAR(), nullable=True))
    op.add_column("jobs", sa.Column("approved", sa.BOOLEAN(), nullable=True))
    op.add_column("jobs", sa.Column("expired", sa.BOOLEAN(), nullable=True))
    op.add_column("jobs", sa.Column("discarded", sa.BOOLEAN(), nullable=True))
    op.add_column(
        "jobs", sa.Column("review", postgresql.JSON(astext_type=sa.Text()), nullable=True)
    )
    op.add_column("jobs", sa.Column("manual", sa.BOOLEAN(), nullable=True))

    # Backfill from new columns
    bind.execute(sa.text("UPDATE jobs SET job_type = type WHERE type IS NOT NULL"))
    bind.execute(sa.text("UPDATE jobs SET manual = COALESCE(manually_created,false)"))
    bind.execute(sa.text("UPDATE jobs SET approved = (state = 'approved')"))
    bind.execute(sa.text("UPDATE jobs SET expired = (state = 'expired')"))
    bind.execute(sa.text("UPDATE jobs SET discarded = (state = 'discarded')"))
    bind.execute(
        sa.text(
            """
        UPDATE jobs
        SET reviewed = CASE WHEN state IN ('reviewed','approved','discarded','expired') THEN true ELSE false END
        """
        )
    )
    # reconstruct review JSON when we have classification/action
    bind.execute(
        sa.text(
            """
        UPDATE jobs
        SET review = jsonb_build_object(
            'classification', classification,
            'action', action
        )
        WHERE classification IS NOT NULL OR action IS NOT NULL
        """
        )
    )

    # Enforce NOT NULL on legacy job booleans
    op.alter_column("jobs", "reviewed", existing_type=sa.Boolean(), nullable=False)
    op.alter_column("jobs", "approved", existing_type=sa.Boolean(), nullable=False)
    op.alter_column("jobs", "expired", existing_type=sa.Boolean(), nullable=False)
    op.alter_column("jobs", "discarded", existing_type=sa.Boolean(), nullable=False)
    op.alter_column("jobs", "manual", existing_type=sa.Boolean(), nullable=False)

    # 3) Drop new references/columns and new table
    # Find and drop FK constraint on applications.form_id referencing application_forms.id
    inspector = sa.inspect(bind)
    fks = inspector.get_foreign_keys("applications")
    for fk in fks:
        if fk.get("referred_table") == "application_forms" and "form_id" in fk.get(
            "constrained_columns", []
        ):
            op.drop_constraint(fk["name"], "applications", type_="foreignkey")
            break
    op.drop_column("applications", "submitted_at")
    op.drop_column("applications", "status")
    op.drop_column("applications", "form_id")
    op.drop_table("application_forms")

    # 4) Drop new job columns
    op.drop_column("jobs", "manually_created")
    op.drop_column("jobs", "action")
    op.drop_column("jobs", "classification")
    op.drop_column("jobs", "state")
    op.drop_column("jobs", "type")
