import { checkSchema } from "express-validator";

const scheduleValidation = checkSchema({
  ...["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]
    .flatMap(day => ([
      {
        [`schedule.${day}.open`]: {
          optional: true,
          matches: {
            options: [/^\d{2}:\d{2}$/],
            errorMessage: `Formato HH:MM inválido para ${day} (open)`
          }
        }
      },
      {
        [`schedule.${day}.close`]: {
          optional: true,
          matches: {
            options: [/^\d{2}:\d{2}$/],
            errorMessage: `Formato HH:MM inválido para ${day} (close)`
          }
        }
      },
      {
        [`schedule.${day}.isClosed`]: {
          optional: true,
          isBoolean: {
            errorMessage: `isClosed debe ser booleano para ${day}`
          }
        }
      }
    ])).reduce((acc, curr) => Object.assign(acc, curr), {})
});

export default scheduleValidation;
