#!/bin/bash

set -euo pipefail

container_name='my-postgres'
image='postgres:18'
force=false

if [[ $# -gt 1 || ($# -eq 1 && $1 != '--force') ]]; then
	printf 'Usage: %s [--force]\n' "$0" >&2
	exit 2
fi

if [[ ${1:-} == '--force' ]]; then
	force=true
fi

if ! command -v podman >/dev/null 2>&1; then
	printf 'Error: podman is required but was not found.\n' >&2
	exit 1
fi

is_postgres_image() {
	local image_name=${1##*/}
	[[ $image_name == postgres || $image_name == postgres:* ]]
}

postgres_containers=()
while IFS=$'\t' read -r id name state image_name; do
	[[ -n $id ]] || continue
	if is_postgres_image "$image_name"; then
		postgres_containers+=("$id"$'\t'"$name"$'\t'"$state")
	fi
done < <(podman ps --all --format '{{.ID}}\t{{.Names}}\t{{.State}}\t{{.Image}}')

if [[ $force == true ]]; then
	for container in "${postgres_containers[@]}"; do
		IFS=$'\t' read -r id name state <<< "$container"
		printf 'Force mode: stopping and removing PostgreSQL container %s (%s).\n' "$name" "$id"
		podman stop "$id" >/dev/null 2>&1 || true
		podman rm "$id"
	done
elif [[ ${#postgres_containers[@]} -gt 0 ]]; then
	for container in "${postgres_containers[@]}"; do
		IFS=$'\t' read -r id name state <<< "$container"
		if [[ $state == 'exited' || $state == 'created' || $state == 'dead' ]]; then
			printf 'Removing exited PostgreSQL container %s (%s).\n' "$name" "$id"
			podman rm "$id"
		elif [[ $state == 'running' ]]; then
			printf 'A PostgreSQL container is already running: %s (%s).\n' "$name" "$id"
			exit 0
		fi
	done
fi

printf 'Starting PostgreSQL container %s.\n' "$container_name"
podman run --name "$container_name" -p 5432:5432 \
	-e POSTGRES_PASSWORD=docgraph \
	-e POSTGRES_USER=docgraph \
	-d "$image"
