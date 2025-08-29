.PHONY: revision upgrade downgrade

db_login:
	psql -U postgres -d job_apps

db_upgrade:
	alembic revision --autogenerate -m "update"
	alembic upgrade head

db_downgrade:
	alembic downgrade -1

