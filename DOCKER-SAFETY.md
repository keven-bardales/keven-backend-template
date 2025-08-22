# ⚠️ DOCKER SAFETY GUIDELINES

## Critical Safety Rules for Docker Commands

### ❌ NEVER Use These Commands in Project Scripts

These commands affect ALL Docker resources system-wide:

```bash
# DANGEROUS - Removes ALL unused containers, networks, images
docker system prune -f

# DANGEROUS - Removes ALL stopped containers  
docker container prune -f

# DANGEROUS - Removes ALL unused volumes
docker volume prune -f  

# DANGEROUS - Removes ALL unused networks
docker network prune -f

# DANGEROUS - Removes ALL images not used by existing containers
docker image prune -a -f
```

### ✅ ALWAYS Use Project-Scoped Commands

These commands only affect this specific project:

```bash
# SAFE - Only stops this project's containers
docker compose down

# SAFE - Stops and removes this project's volumes
docker compose down -v

# SAFE - Remove specific volume by name
docker volume rm keven-backend-template_postgres_data

# SAFE - Stop specific container
docker stop keven-backend

# SAFE - Remove specific container
docker rm keven-backend
```

## Production Environment Rules

1. **Never run cleanup commands on production servers**
2. **Always use explicit resource names, never wildcards**
3. **Require confirmation for any destructive operation**
4. **Log all Docker operations for audit trails**
5. **Use separate Docker contexts for dev/staging/production**

## Safe Cleanup Process

### For Development
```bash
# Step 1: Stop containers gracefully
docker compose stop

# Step 2: Remove containers and volumes (project only)
docker compose down -v

# Step 3: Verify what was removed
docker ps -a | grep keven
docker volume ls | grep keven
```

### For Production
```bash
# NEVER run automated cleanup in production
# Always manually verify each operation
# Always have backups before any destructive operation
```

## Recovery from Mistakes

If you accidentally run a system-wide prune:

1. **Check what's still running:**
   ```bash
   docker ps -a
   docker images
   docker volume ls
   ```

2. **Restart critical services immediately**

3. **Document what was lost for recovery**

4. **Restore from backups if necessary**

## Incident Response

If a destructive command is run in production:

1. **IMMEDIATELY notify the team**
2. **Document exactly what command was run**
3. **Check service status of all applications**
4. **Begin recovery procedures**
5. **Create incident report**

---

**Remember:** In production, one wrong Docker command can bring down multiple services. Always double-check commands and their scope before execution.