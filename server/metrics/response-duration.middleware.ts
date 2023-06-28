import { Handler, NextFunction, Request, Response } from "express";
import { Histogram, Counter } from "prom-client";
import { register } from "../routes/metrics";

const responseDurationHistogram: Histogram = new Histogram({
  name: 'response_duration',
  help: 'response_duration',
  labelNames: ["method", "path", "status"],
  registers: [register]
});

const linkCounter = new Counter({
  name: 'link_counter',
  help: 'Number of link created',
  labelNames: ['links'],
  registers: [register]
})

export const responseDurationMiddleware: Handler = (
  req: Request, res: Response, next
) => {
  const { method, originalUrl } = req;

  const endTimer = responseDurationHistogram.startTimer({
    method,
    path: originalUrl
  })
  
  res.on("close", () => {
    const { statusCode } = res;
    endTimer({ status: statusCode });
  });

  next();
};

export const linkCounterMiddleware: Handler = (
  _req: Request, res: Response, next: NextFunction,
) => {
  res.on("close", () => {
    if ([200, 201].includes(res.statusCode)) {
      linkCounter.inc(1);
    }
  })
  next();
}
