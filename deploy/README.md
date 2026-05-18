# Horus deploy

Target app port: `8003`

Use `horus.service.example` as a systemd service template and `nginx-horus.conf.example` as an Nginx reverse proxy template.

The DNS `A` record should point `horus.md21.online` to the server IP.

Use a single SQLite database file for this deploy:

```env
SQLITE_PATH=/var/www/horus/db.sqlite3
```

Do not commit or deploy the local `db.sqlite3` file through Git. On the server, create the production database with:

```bash
python manage.py migrate
```
