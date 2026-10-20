#!/usr/bin/env bash
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. See https://mozilla.org/MPL/2.0/.
# Copy the change record only; evaluation and publication use existing tools.
set -euo pipefail

usage() {
  printf 'Usage: bash %s DESTINATION.md\nCreates a change record; never overwrites an existing file.\n' "$0"
}

if [[ $# == 1 && ( $1 == --help || $1 == -h ) ]]; then
  usage
  exit 0
fi
if [[ $# != 1 || -z ${1:-} ]]; then
  usage >&2
  exit 2
fi

script_dir="$(CDPATH= cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
template="$script_dir/../assets/change-record.md"
destination=$1
if [[ ! -f $template ]]; then
  printf 'Missing change-record template: %s\n' "$template" >&2
  exit 1
fi

mkdir -p -- "$(dirname -- "$destination")"
if ! (set -o noclobber; cat -- "$template" > "$destination"); then
  printf 'Change record was not created: %s\n' "$destination" >&2
  exit 1
fi
printf 'Created %s\n' "$destination"
