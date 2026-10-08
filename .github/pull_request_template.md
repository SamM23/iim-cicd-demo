## What and why

## Checklist
- [ ] Tests added or updated (`src/*.test.mjs` and/or `terraform/tests/*.tftest.hcl`)
- [ ] `terraform fmt` run
- [ ] Plan comment reviewed: nothing unexpected is created, changed or destroyed
- [ ] No keys, passwords or real student data committed

## Cost
Does this add a resource with an hourly or standing cost (NAT Gateway, ALB, RDS, always-on EC2/Fargate)?
- [ ] No
- [ ] Yes (name it and the teardown plan):
