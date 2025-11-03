/**
 * Inicia el scheduler de tareas usando node-cron
 * Ejecutar este archivo al iniciar el servidor
 */

import { runAllTenantsTasks } from './tasks-scheduler';
import { generateTasksForAllTenants } from './generate-monthly-tasks';
import cron from 'node-cron';

// Job 1: Generar tareas del mes - Ejecutar el día 1 de cada mes a la 1 AM
cron.schedule('0 1 1 * *', async () => {
  console.log('[SCHEDULER] Generando tareas del mes...');
  await generateTasksForAllTenants();
  console.log('[SCHEDULER] Generación de tareas completada');
});

// Job 2: Activar/marcar tareas - Ejecutar diariamente a las 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('[SCHEDULER] Ejecutando activación de tareas programadas...');
  await runAllTenantsTasks();
  console.log('[SCHEDULER] Activación de tareas completada');
});

// También ejecutar inmediatamente al iniciar (opcional, para testing)
if (process.env.RUN_SCHEDULER_ON_START === 'true') {
  console.log('[SCHEDULER] Ejecutando jobs al iniciar...');
  Promise.all([
    generateTasksForAllTenants(),
    runAllTenantsTasks()
  ]).catch(console.error);
}

console.log('[SCHEDULER] Scheduler iniciado');
console.log('[SCHEDULER] - Generación de tareas: Día 1 de cada mes a la 1 AM');
console.log('[SCHEDULER] - Activación de tareas: Diariamente a las 2 AM');

