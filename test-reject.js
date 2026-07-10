const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

async function testReject() {
  const driver = await prisma.deliveryDriver.findFirst({ include: { user: true } });
  if (!driver) return console.log('No driver found');
  
  const token = jwt.sign(
    { userId: driver.user.id, role: driver.user.role },
    process.env.JWT_SECRET || 'fallback-secret-for-dev-only-do-not-use-in-prod',
    { expiresIn: '30d' }
  );

  const job = await prisma.deliveryJob.findFirst({ where: { driverId: driver.id, status: 'accepted' } });
  if (!job) return console.log('No accepted job found for driver');

  console.log('Job ID:', job.id);

  const res = await fetch(`http://localhost:3000/api/driver/jobs/${job.id}/reject`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Response:', data);
}

testReject().catch(console.error);
