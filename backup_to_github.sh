#!/bin/bash

# This script stages all changes, commits with a timestamp message, and pushes to the remote GitHub repository.
# Ensure you have set the remote repository and have proper authentication configured.

# Stage all changes except ignored files
git add .

# Commit with current date and time as message
commit_message="Backup on $(date '+%Y-%m-%d %H:%M:%S')"
git commit -m "$commit_message"

# Push to the default remote and branch (usually origin main or master)
git push

echo "Backup completed with commit message: $commit_message"
