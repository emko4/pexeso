DOCKER := docker
CLIENT_IMAGE=$(REPOSITORY_URL)/gnosus/web-client:$(TAG)
# Temporary fix - can't tag to three level name as gitlab suggest
SERVER_IMAGE=$(REPOSITORY_URL)/gnosus/web-client:server-$(TAG)

all: build

release: build
	$(DOCKER) push $(CLIENT_IMAGE)
	$(DOCKER) push $(SERVER_IMAGE)

build: build-react build-server-image

build-client-image:
	$(DOCKER) build -t $(CLIENT_IMAGE) -f docker/Dockerfile docker/

build-server-image:
	$(DOCKER) build -t $(SERVER_IMAGE) -f server/Dockerfile .

yarn-install: build-client-image
	{ \
		$(DOCKER) run --rm -i \
			-v "$(shell pwd)":/srv/ \
			$(CLIENT_IMAGE) \
			yarn --non-interactive --no-progress --production=false ;\
	}

build-react: clean yarn-install
	{ \
		$(DOCKER) run --rm -i \
			-e "NODE_ENV=$(NODE_ENV)" \
			-e "ASSEMBLY_ENV=$(ASSEMBLY_ENV)" \
			-v "$(shell pwd)":/srv/ \
			$(CLIENT_IMAGE) yarn build ;\
	}

clean:
	$(DOCKER) run --rm -i -v "$(shell pwd)":/srv/ busybox rm -rf /srv/build/*
	$(DOCKER) run --rm -i -v "$(shell pwd)":/srv/ busybox rm -rf /srv/server/temp/cache

clean-all: clean
	$(DOCKER) run --rm -i -v "$(shell pwd)":/srv/ busybox rm -rf /srv/node_modules/
	$(DOCKER) run --rm -i -v "$(shell pwd)":/srv/ busybox rm -rf /srv/server/log/*
