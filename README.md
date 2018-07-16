# cfdns

Basic grab ip and update specfic cloudflare record for use as a dynamic ip updater.

## Usage

```
node cfdns.js
```

Valid args:

- -v : verbose
- -vv : very verbose

## Installation (Raspian)

Install Node Repo

```
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
```

Install NodeJS

```
sudo apt-get install -y nodejs
```

Clone repo

```
git clone https://github.com/secopsbot/cfdns
```

Install required modules

```
cd /path/to/cfdns

npm install
```
