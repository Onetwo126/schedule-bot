# Запуск schedule-bot на Google Cloud VM

## 1. Подготовить проект

Клонировать репозиторий на VM и установить зависимости:

```bash
git clone <адрес-репозитория>
cd schedule-bot
npm ci --omit=dev
```

Нужен Node.js 22.5 или новее: SQLite используется из стандартной библиотеки Node.js.

```bash
node --version
```

Положить в каталог проекта файлы, которых нет в Git:

- `.env`;
- `credentials/service-account.json`.

Ограничить доступ к секретам:

```bash
chmod 600 .env credentials/service-account.json
```

Проверить абсолютный путь проекта, пользователя Linux и Node.js:

```bash
pwd
whoami
command -v node
```

## 2. Подготовить systemd

В `deploy/schedule-bot.service` заменить:

- `REPLACE_WITH_LINUX_USER` на результат `whoami`;
- `REPLACE_WITH_PROJECT_PATH` на результат `pwd`;
- `REPLACE_WITH_NODE_PATH` на результат `command -v node`.

Установить unit-файл и запустить сервис:

```bash
sudo cp deploy/schedule-bot.service /etc/systemd/system/schedule-bot.service
sudo systemctl daemon-reload
sudo systemctl enable --now schedule-bot
sudo systemctl status schedule-bot
```

`systemd` сам создаст закрытый каталог `/var/lib/schedule-bot`. Основная база будет храниться в `/var/lib/schedule-bot/schedule-bot.db`; обновление проекта через Git её не затронет.

Для одноразовой миграции уже зарегистрированных пользователей положить прежний JSON в `/var/lib/schedule-bot/users.json` до первого запуска версии 1.1:

```bash
sudo install -d -m 700 -o REPLACE_WITH_LINUX_USER -g REPLACE_WITH_LINUX_USER /var/lib/schedule-bot
sudo install -m 600 -o REPLACE_WITH_LINUX_USER -g REPLACE_WITH_LINUX_USER data/users.json /var/lib/schedule-bot/users.json
```

При первом запуске бот транзакционно импортирует JSON в SQLite. JSON можно оставить как резервную копию: повторно он не импортируется. В этих двух командах заменить `REPLACE_WITH_LINUX_USER`.

## 3. Проверка и логи

Чтобы журнал сохранялся и после перезагрузки VM, один раз включить постоянное хранилище `journald`:

```bash
sudo mkdir -p /var/log/journal
sudo systemd-tmpfiles --create --prefix /var/log/journal
sudo systemctl restart systemd-journald
```

Последние записи журнала:

```bash
sudo journalctl -u schedule-bot -n 100 --no-pager
```

Наблюдение за журналом в реальном времени:

```bash
sudo journalctl -u schedule-bot -f
```

После обновления кода:

```bash
git pull
npm ci --omit=dev
sudo systemctl restart schedule-bot
sudo systemctl status schedule-bot
```

После запуска проверить журнал. В нём должны появиться сообщения о загрузке общего кэша, регистрации команд Telegram и запуске scheduler:

```bash
sudo journalctl -u schedule-bot -n 100 --no-pager
```

Практическая проверка версии 1.1:

1. Открыть Menu в Telegram: видны `/start` и `/login`.
2. Через `/login` указать новый действующий логин и проверить расписание.
3. Перезапустить сервис и повторно открыть `/start`: логин не запрашивается.
4. Проверить «Расписание на сегодня» и «Что сейчас?». Для напоминания дождаться контрольной границы за 3 минуты до активности.
5. В журнале за одну минуту не должно быть отдельных чтений Google Sheets для каждого пользователя.

Остановка и повторный запуск:

```bash
sudo systemctl stop schedule-bot
sudo systemctl start schedule-bot
```
