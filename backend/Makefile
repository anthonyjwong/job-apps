.PHONY: db_login db_revision db_upgrade db_downgrade db_current db_heads

db_login:
	PGPASSWORD=$(DB_PASSWORD) psql -h localhost -p $(DB_PORT_HOST) -U $(DB_USER) -d $(DB_NAME)

# Create a new autogenerate revision and apply all pending migrations
db_upgrade:
	alembic revision --autogenerate -m "update"	
	alembic upgrade head

db_downgrade:
	alembic downgrade -1

# Show current DB revision
db_current:
	alembic current

# Show latest (head) revision(s)
db_heads:
	alembic heads

