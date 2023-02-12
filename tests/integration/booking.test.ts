import app, { init } from "@/app";
import { prisma } from "@/config";
import faker from "@faker-js/faker";
import { TicketStatus } from "@prisma/client";
import e from "express";
import httpStatus from "http-status";
import * as jwt from "jsonwebtoken";
import supertest from "supertest";
import {
  createEnrollmentWithAddress,
  createUser,
  createTicketType,
  createTicket,
  createPayment,
  generateCreditCardData,
  createTicketTypeWithHotel,
  createTicketTypeRemote,
  createHotel,
  createRoomWithHotelId,
  createBooking,
  createBody
} from "../factories";
import { cleanDb, generateValidToken } from "../helpers";

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe("GET /booking", () => {
  it("should respond with status 401 if no token is given", async () => {
    const response = await server.get("/booking");

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();

    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
    it("should respond with status 404 when user is without booking ", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeRemote();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);
      const createdHotel = await createHotel();

      const room = createRoomWithHotelId(createdHotel.id);

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 404 when user has no enrollment ", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);

      const ticketType = await createTicketTypeRemote();

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.NOT_FOUND);
    });

    it("should respond with status 200 when booking exists", async () => {
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      const payment = await createPayment(ticket.id, ticketType.price);

      const createdHotel = await createHotel();
      const room = await createRoomWithHotelId(createdHotel.id);

      const booking = await createBooking(user.id, room.id)

      const response = await server.get("/booking").set("Authorization", `Bearer ${token}`);

      expect(response.status).toEqual(httpStatus.OK);

      expect(response.body).toEqual(
        {
          id: booking.id,
          userId: booking.userId,
          roomId: booking.roomId,
          createdAt: booking.createdAt.toISOString(),
          updatedAt: booking.updatedAt.toISOString(),
          Room:{
            id: room.id,
            name: room.name,
            capacity: room.capacity,
            hotelId: room.hotelId,
            createdAt: room.createdAt.toISOString(),
            updatedAt: room.updatedAt.toISOString()            
          }          
        }
      );
    });

    
  });
});

describe("POST /booking", () => {
    it("should respond with status 401 if no token is given", async () => {
      const body = createBody()
      const response = await server.post("/booking").send(body);
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  
    it("should respond with status 401 if given token is not valid", async () => {
      const token = faker.lorem.word();
      const body = createBody()
  
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  
    it("should respond with status 401 if there is no session for given token", async () => {
      const userWithoutSession = await createUser();
      const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
      const body = createBody()
  
      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send(body);
  
      expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });
  
    describe("when token is valid", () => {
      it("should respond with status 404 when roomId is invalid", async () =>{
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        const payment = await createPayment(ticket.id, ticketType.price);
    
        const createdHotel = await createHotel();
        const room = await createRoomWithHotelId(createdHotel.id);
    
        await createBooking(user.id, room.id);
    
        const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({roomId: -1});
    
        expect(response.status).toEqual(httpStatus.NOT_FOUND);
    }) 
        it("should respond with status 200 when booking exists", async () =>{
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user);
            const ticketType = await createTicketTypeWithHotel();
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
            const payment = await createPayment(ticket.id, ticketType.price);
      
            const createdHotel = await createHotel();
            const room = await createRoomWithHotelId(createdHotel.id);
      
            const booking = await createBooking(user.id, room.id);
      
            const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({roomId: room.id});
      
            expect(response.status).toEqual(httpStatus.OK);
        })  
        it("should respond with status 403 when ticket is not paid", async () =>{
          const user = await createUser();
          const token = await generateValidToken(user);
          const enrollment = await createEnrollmentWithAddress(user);
          const ticketType = await createTicketTypeWithHotel();
          const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
          const payment = await createPayment(ticket.id, ticketType.price);
    
          const createdHotel = await createHotel();
          const room = await createRoomWithHotelId(createdHotel.id);
    
          const booking = await createBooking(user.id, room.id);
    
          const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({roomId: room.id});
    
          expect(response.status).toEqual(httpStatus.FORBIDDEN);
      })  
      
    it("should respond with status 403 when no vacancy", async () =>{
      const user = await createUser();
      const token = await generateValidToken(user);
      const enrollment = await createEnrollmentWithAddress(user);
      const ticketType = await createTicketTypeWithHotel();
      const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
      const payment = await createPayment(ticket.id, ticketType.price);

      const createdHotel = await createHotel();
      const room = await createRoomWithHotelId(createdHotel.id);

      await createBooking(user.id, room.id);
      await createBooking(user.id, room.id);
      await createBooking(user.id, room.id);

      const response = await server.post("/booking").set("Authorization", `Bearer ${token}`).send({roomId: room.id});

      expect(response.status).toEqual(httpStatus.FORBIDDEN);
  })  
 
      
    });
});

describe("PUT /booking/", () => {
  it("should respond with status 401 if no token is given", async () => {
    const body = createBody()
    const response = await server.put("/booking/1").send(body);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if given token is not valid", async () => {
    const token = faker.lorem.word();
    const body = createBody()

    const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`).send(body);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it("should respond with status 401 if there is no session for given token", async () => {
    const userWithoutSession = await createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const body = createBody()

    const response = await server.put("/booking/1").set("Authorization", `Bearer ${token}`).send(body);

    expect(response.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe("when token is valid", () => {
      it("should respond with status 200 when booking exists", async () =>{
          const user = await createUser();
          const token = await generateValidToken(user);
          const enrollment = await createEnrollmentWithAddress(user);
          const ticketType = await createTicketTypeWithHotel();
          const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
          const payment = await createPayment(ticket.id, ticketType.price);
    
          const createdHotel = await createHotel();
          const room = await createRoomWithHotelId(createdHotel.id);
    
          const booking = await createBooking(user.id, room.id);
    
          const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send({roomId: room.id});
    
          expect(response.status).toEqual(httpStatus.OK);
      })  
      it("should respond with status 403 when bookingId doesn't exists", async () =>{
        const user = await createUser();
        const token = await generateValidToken(user);
        const enrollment = await createEnrollmentWithAddress(user);
        const ticketType = await createTicketTypeWithHotel();
        const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
        const payment = await createPayment(ticket.id, ticketType.price);
  
        const createdHotel = await createHotel();
        const room = await createRoomWithHotelId(createdHotel.id);
  
        const booking = await createBooking(user.id, room.id);
  
        const response = await server.put("/booking/0").set("Authorization", `Bearer ${token}`).send({roomId: room.id});
  
        expect(response.status).toEqual(httpStatus.FORBIDDEN);
    })  
    
  it("should respond with status 403 when no vacancy", async () =>{
    const user = await createUser();
    const token = await generateValidToken(user);
    const enrollment = await createEnrollmentWithAddress(user);
    const ticketType = await createTicketTypeWithHotel();
    const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
    const payment = await createPayment(ticket.id, ticketType.price);

    const createdHotel = await createHotel();
    const room = await createRoomWithHotelId(createdHotel.id);

    const booking = await createBooking(user.id, room.id);
    await createBooking(user.id, room.id);
    await createBooking(user.id, room.id);

    const response = await server.put(`/booking/${booking.id}`).set("Authorization", `Bearer ${token}`).send({roomId: room.id});

    expect(response.status).toEqual(httpStatus.FORBIDDEN);
}) 
it("should respond with status 404 when roomId is invalid", async () =>{
  const user = await createUser();
  const token = await generateValidToken(user);
  const enrollment = await createEnrollmentWithAddress(user);
  const ticketType = await createTicketTypeWithHotel();
  const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
  const payment = await createPayment(ticket.id, ticketType.price);

  const createdHotel = await createHotel();
  const room = await createRoomWithHotelId(createdHotel.id);

  const booking = await createBooking(user.id, room.id);

  const response = await server.put(`/booking/0`).set("Authorization", `Bearer ${token}`).send({roomId: 0});

  expect(response.status).toEqual(httpStatus.NOT_FOUND);
})   
    
  });
});

  


