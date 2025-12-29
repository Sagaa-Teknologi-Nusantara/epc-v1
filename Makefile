.PHONY: dev build start lint db-migrate db-seed clean

# Development
dev:
	yarn dev

# Build for production
build:
	yarn build

# Start production server
start:
	yarn start

# Lint
lint:
	yarn lint

# Database migrations (Supabase)
db-migrate:
	npx supabase db push

db-seed:
	npx supabase db seed

# Clean build artifacts
clean:
	rm -rf .next node_modules

# Install dependencies
install:
	yarn install

# Type check
typecheck:
	yarn tsc --noEmit
