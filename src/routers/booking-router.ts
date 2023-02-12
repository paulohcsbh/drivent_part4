import { Router } from "express";
import bookingController from "@/controllers/booking-controller";
import { authenticateToken } from "@/middlewares";


const bookingRouter = Router();

bookingRouter
    .all("/*", authenticateToken)
    .get("/", bookingController.getAllBookings)
    .post("/", bookingController.postBooking)
    .put("/:bookingId", bookingController.putBooking)

export { bookingRouter };
