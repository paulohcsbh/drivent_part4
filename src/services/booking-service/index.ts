import bookingRepository from "@/repositories/booking-repository";
import ticketRepository from "@/repositories/ticket-repository";
import roomRepository from "@/repositories/room-repository";
import enrollmentRepository from "@/repositories/enrollment-repository";
import { notFoundError, bookingError } from "@/errors";


async function getBookings(userId: number) {
    const booking = await bookingRepository.getBookings(userId);
    if (!booking) {
        throw notFoundError();
    }
    return booking;
}

async function createBooking(userId: number, roomId: number) {
    const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
    if (!enrollment) {
        throw notFoundError();
    }
    const ticket = await ticketRepository.findTicketByEnrollmentId(enrollment.id);
    console.log(ticket)

    if (ticket.status === "RESERVED" || ticket.TicketType.isRemote === true || ticket.TicketType.includesHotel === false) {
        throw bookingError();
    }
    const room = await roomRepository.getRoom(roomId);
    if (!room) {
        throw notFoundError();
    }
    const booking = await bookingRepository.getBookingByRoomId(roomId);
    if (room.capacity <= booking.length) {
        throw bookingError();
    }

    return await bookingRepository.createBooking(userId, roomId);
}

async function updateBooking(id: number, userId: number, roomId: number) {
    const hasBooking = await bookingRepository.getBookings(userId);
    if (!hasBooking) {
        throw bookingError();
    }
    const room = await roomRepository.getRoom(roomId);
    if (!room) {
        throw notFoundError();
    }
    const booking = await bookingRepository.getBookingByRoomId(roomId);
    if (room.capacity <= booking.length) {
        throw bookingError();
    }
    return bookingRepository.updateBooking(id, roomId);
}


const bookingService = {
    getBookings,
    createBooking,
    updateBooking
}
export default bookingService;