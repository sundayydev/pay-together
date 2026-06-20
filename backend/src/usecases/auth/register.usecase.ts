import { User } from "../../domain/entities/user.entity";
import { UserRepository } from "../../domain/repositories/user.repository";
import { hashPassword } from "../../utils/crypto";

export class RegisterUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(input: {
    phoneNumber: string;
    password: string;
    name: string;
    momoPhone?: string | null;
    bankCode?: string | null;
    bankAccount?: string | null;
    bankAccountName?: string | null;
  }): Promise<User> {
    const existingUser = await this.userRepository.findByPhoneNumber(input.phoneNumber);
    if (existingUser) {
      throw new Error("Phone number already registered");
    }

    const passwordHash = await hashPassword(input.password);

    return this.userRepository.create({
      phoneNumber: input.phoneNumber,
      passwordHash,
      name: input.name,
      avatarUrl: null,
      momoPhone: input.momoPhone || null,
      bankCode: input.bankCode || null,
      bankAccount: input.bankAccount || null,
      bankAccountName: input.bankAccountName || null,
      deletedAt: null,
    });
  }
}
