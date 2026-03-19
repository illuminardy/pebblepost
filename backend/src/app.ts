import express from 'express';
import cors from 'cors';
import { linkRouter } from './routes/links';
import { analyticsRouter } from './routes/analytics';
import { redirectRouter } from './routes/redirect';
import { errorHandler } from './middleware/error-handler';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1/links', linkRouter);
app.use('/api/v1/links', analyticsRouter);

app.use('/', redirectRouter);

app.use(errorHandler);

export { app };
