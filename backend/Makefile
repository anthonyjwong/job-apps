.PHONY: db_login db_revision db_upgrade db_downgrade db_current db_heads

db_login:
	psql -U postgres -d job_apps

# Create a new autogenerate revision: make db_revision msg="your message"
db_revision:
	alembic revision --autogenerate -m "$(msg)"

# Apply all pending migrations
db_upgrade:
	alembic upgrade head

db_downgrade:
	alembic downgrade -1

# Show current DB revision
db_current:
	alembic current

# Show latest (head) revision(s)
db_heads:
	alembic heads

