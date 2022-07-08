## Launch your own Oni using this corpus tool data
Notes: 
- This has been tested with MacOS on arm64
- authentication details not provided, you will need to provide your own (AKA, you need to configure either github or cilogon to login, however it is not requried for Farms to freeways to display data)

0. Install docker and docker-compose

1. Create your ocfl directory for oni.
   1. This is after you have followed the [README.md](../README.md) 
      1. This involves running `npm install`
   2. Edit `make_ocfl_for_local_oni.sh` to include your data
      1. FARMS_TO_FREEWAYS_TEMPLATE_DIR
      2. FARMS_TO_FREEWAYS_DATA_DIR
      3. save file
   3. Run `make_ocfl_for_local_oni.sh`
      1. you should have an ocfl directory in `oni/data/ocfl`

2. cd into `oni`

3. Verify your `configuration.json` configuration file (You will launch in production mode)

4. Launch docker-compose
```bash
docker-compose up
```

5. if you need to re-index, both structural index and elastic index do:
```bash
docker-compose restart api
```
Make sure your configuration file has
```json
"api": {
  "bootstrap": true,
```
and
```json
"elastic": {
  "bootstrap": true,
```

6. You should be able to launch a portal in [http://localhost:9000](http://localhost:9000)
   1. If you dont see any data it means that the ocfl directory is incorrect or it did not have a change to index; force to reindex by doing `docker-compose restart api`
