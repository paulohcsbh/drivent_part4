import bookingService from "@/services/booking-service";
import { AuthenticatedRequest } from "@/middlewares";
import { Response } from "express";
import httpStatus from "http-status";

async function getAllBookings(req: AuthenticatedRequest, res: Response) {
    try {
        const { userId } = req;
        const bookings = await bookingService.getBookings(userId);

        return res.status(httpStatus.OK).send(bookings);
    } catch (error) {
        return res.sendStatus(httpStatus.NOT_FOUND);
    }
}
async function postBooking(req: AuthenticatedRequest, res: Response) {
    try {
        const { userId } = req;
        const { roomId } = req.body;
        await bookingService.createBooking(userId, Number(roomId));
        const booking = await bookingService.getBookings(userId);
        console.log(booking)
        return res.status(httpStatus.OK).send({ bookingId: booking.id });

    } catch (error) {
        if (error.name === "BookingError") {
            return res.sendStatus(httpStatus.FORBIDDEN);
        }
        if (error.name === "NotFoundError") {
            return res.sendStatus(httpStatus.NOT_FOUND);
        }
        return res.sendStatus(httpStatus.OK);
    }

}

async function putBooking(req: AuthenticatedRequest, res: Response) {
    try {
        const { userId } = req;
        const id = Number(req.params.bookingId);
        const { roomId } = req.body;
        await bookingService.updateBooking(id, userId, Number(roomId));
        const booking = await bookingService.getBookings(userId);
        return res.status(httpStatus.OK).send({ bookingId: booking.id });

    } catch (error) {
        if (error.name === "BookingError") {
            return res.sendStatus(httpStatus.FORBIDDEN);
        }
        if (error.name === "NotFoundError") {
            return res.sendStatus(httpStatus.NOT_FOUND);
        }
        return res.sendStatus(httpStatus.FORBIDDEN);
    }

}



const bookingController = {
    getAllBookings,
    postBooking,
    putBooking
}
export default bookingController;