import { createLogger, format, transports } from 'winston';
import { join } from 'path';
import { app } from 'electron';

const logPath = join(app.getPath('userData'), 'logs');

const level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';
const logger = createLogger({
  level,
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json(),
  ),
  transports: [new transports.File({ filename: join(logPath, 'app.log') })],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
  );
}

export default logger;
