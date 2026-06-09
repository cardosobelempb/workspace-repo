import { NotFoundError } from "@repo/common";
import { UserFactory } from "../../factories";
import { UserMapper } from "../../mappers";
import { MeUseCase } from "../me.use-case";
import { UserInMemoryRepository } from "../../../domain/repositories/in-memory/user-in-memory.repository";

describe("MeUseCase", () => {
  let sut: MeUseCase;
  let userInMemoryRepository: UserInMemoryRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    userInMemoryRepository = new UserInMemoryRepository();
    sut = new MeUseCase(userInMemoryRepository);
  });

  describe("Success Cases", () => {
    it("should return user projection when user exists", async () => {
      const user = UserFactory.build({
        email: "john@email.com",
        firstName: "John",
        lastName: "Doe",
        passwordHash: "$2b$10$123456789012345678901uR5u6ZwWGXlLB9G6art.rT3xES8A7U4a",
        emailVerified: null,
      });

      await userInMemoryRepository.create(user);

      const findByIdSpy = jest.spyOn(userInMemoryRepository, "findById");
      const mapperSpy = jest.spyOn(UserMapper, "toProjection");
      const expectedProjection = {
        id: user.id.getValue(),
        email: user.email.getValue().value,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified?.toISOString() ?? null,
      };

      const result = await sut.execute(user.id.getValue());

      expect(result.isRight()).toBe(true);

      if (result.isRight()) {
        expect(result.value).toEqual({
          user: expectedProjection,
        });
      }

      expect(findByIdSpy).toHaveBeenCalledTimes(1);
      expect(findByIdSpy).toHaveBeenCalledWith(user.id.getValue());
      expect(mapperSpy).toHaveBeenCalledTimes(1);
      expect(mapperSpy).toHaveBeenCalledWith(user);
    });
  });

  describe("Failure Cases", () => {
    it("should return NotFoundError when user does not exist", async () => {
      const userId = "550e8400-e29b-41d4-a716-446655440000";
      const findByIdSpy = jest.spyOn(userInMemoryRepository, "findById");
      const mapperSpy = jest.spyOn(UserMapper, "toProjection");

      const result = await sut.execute(userId);

      expect(result.isLeft()).toBe(true);

      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(NotFoundError);
        expect(result.value.message).toBe("User not found");
      }

      expect(findByIdSpy).toHaveBeenCalledTimes(1);
      expect(findByIdSpy).toHaveBeenCalledWith(userId);
      expect(mapperSpy).not.toHaveBeenCalled();
    });

    it("should return NotFoundError when user is soft deleted", async () => {
      const user = UserFactory.build({
        email: "john@email.com",
        firstName: "John",
        lastName: "Doe",
        passwordHash: "$2b$10$123456789012345678901uR5u6ZwWGXlLB9G6art.rT3xES8A7U4a",
        emailVerified: null,
      });

      user.softDelete();
      await userInMemoryRepository.create(user);

      const findByIdSpy = jest.spyOn(userInMemoryRepository, "findById");
      const mapperSpy = jest.spyOn(UserMapper, "toProjection");

      const result = await sut.execute(user.id.getValue());

      expect(result.isLeft()).toBe(true);

      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(NotFoundError);
        expect(result.value.message).toBe("User not found");
      }

      expect(findByIdSpy).toHaveBeenCalledTimes(1);
      expect(findByIdSpy).toHaveBeenCalledWith(user.id.getValue());
      expect(mapperSpy).not.toHaveBeenCalled();
    });

    it("should return NotFoundError when userId is empty", async () => {
      const findByIdSpy = jest.spyOn(userInMemoryRepository, "findById");

      const result = await sut.execute("");

      expect(result.isLeft()).toBe(true);

      if (result.isLeft()) {
        expect(result.value).toBeInstanceOf(NotFoundError);
        expect(result.value.message).toBe("User not found");
      }

      expect(findByIdSpy).toHaveBeenCalledTimes(1);
      expect(findByIdSpy).toHaveBeenCalledWith("");
    });
  });

  describe("Edge Cases", () => {
    it("should call repository with uuid format userId", async () => {
      const userId = "550e8400-e29b-41d4-a716-446655440000";
      const findByIdSpy = jest.spyOn(userInMemoryRepository, "findById");

      await sut.execute(userId);

      expect(findByIdSpy).toHaveBeenCalledTimes(1);
      expect(findByIdSpy).toHaveBeenCalledWith(userId);
    });
  });
});
