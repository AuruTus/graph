# Graph visualization and analytics tools
This project demonstrates graph visualization and analytics tools using NetworkX, Django, React, Node.js and Docker.

# Running the project

You need to install [docker] (https://docs.docker.com/engine/installation/) and [docker-compose] (https://docs.docker.com/compose/install/) to run demo. 

1. Gitclone or download project to a machine with docker and docker-compose installed.

2. Use docker-compose to build needed containers and run code:
```
docker-compose up
```

## Running as daemon
If you need it's possible to run project as daemon, like at production:
```
docker-compose -f docker-compose.yml -f production.yml up -d
```
