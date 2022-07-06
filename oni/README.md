## Launch your own Oni using this corpus tool data
Notes: 
- This has been tested with MacOS on arm64
- authentication details not provided, you will need to provide your own

0. Install docker and docker-compose

1. cd into `oni`

2. Create an ocfl repository on the `data` folder, so it looks like:
```bash
data/ocfl
```

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
