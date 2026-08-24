# Запуск schedule-bot на Oracle VM

## 1. Подготовить проект

Клонировать репозиторий на VM и установить зависимости:

```bash
git clone <адрес-репозитория>
cd schedule-bot
npm ci --omit=dev
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

`systemd` сам создаст закрытый каталог `/var/lib/schedule-bot` и будет хранить пользователей в `/var/lib/schedule-bot/users.json`. Обновление проекта через Git этот файл не затронет.

Если нужно перенести уже зарегистрированных пользователей, сначала безопасно скопировать текущий `data/users.json` с Mac на VM, а затем до первого запуска сервиса выполнить:

```bash
sudo install -d -m 700 -o REPLACE_WITH_LINUX_USER -g REPLACE_WITH_LINUX_USER /var/lib/schedule-bot
sudo install -m 600 -o REPLACE_WITH_LINUX_USER -g REPLACE_WITH_LINUX_USER data/users.json /var/lib/schedule-bot/users.json
```

В этих двух командах также заменить `REPLACE_WITH_LINUX_USER`.

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

Остановка и повторный запуск:

```bash
sudo systemctl stop schedule-bot
sudo systemctl start schedule-bot
```
