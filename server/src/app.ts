import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './api/routes';
import { ApiError } from './utils/apiError';

// Cargar variables de entorno
dotenv.config();

const app: Application = express();
const port = process.env.PORT || 3001;

// Middlewares básicos
app.use(cors()); // Habilitar CORS para permitir peticiones del frontend
app.use(express.json()); // Parsear cuerpos de petición en formato JSON
app.use(express.urlencoded({ extended: true })); // Parsear cuerpos de petición URL-encoded

// Ruta de bienvenida
app.get('/', (req: Request, res: Response) => {
    res.send('API del Sistema de Gestión Tributaria funcionando!');
});

// Registrar todas las rutas de la API bajo el prefijo /api
app.use('/api', apiRoutes);


// Middleware para manejar rutas no encontradas (404)
app.use((req: Request, res: Response, next: NextFunction) => {
    next(new ApiError(404, 'Ruta no encontrada'));
});

// Middleware para manejar todos los errores
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            message: err.message,
            errors: err.errors,
        });
    }
    
    // Para errores inesperados del servidor
    console.error(err); // Loguear el error para depuración
    return res.status(500).json({
        message: 'Error interno del servidor',
    });
});


app.listen(port, () => {
    console.log(`Servidor API escuchando en http://localhost:${port}`);
});
