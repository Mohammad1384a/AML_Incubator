import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { User } from "../generated/prisma/client";
import * as bcrypt from "bcrypt";

import { PrismaService } from "../database/prisma.service";
import { JwtPayload } from "../common/interfaces/jwt-payload.interface";
import { AuthUserDto } from "./dto/auth-user.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthUserDto> {
    const existingUser: User | null = await this.prismaService.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException("Email is already in use.");
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    const user = await this.prismaService.user.create({
      data: {
        email: registerDto.email,
        passwordHash,
      },
    });

    return this.toAuthUserDto(user);
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ user: AuthUserDto; accessToken: string }> {
    const user: User | null = await this.prismaService.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      user: this.toAuthUserDto(user),
      accessToken,
    };
  }

  toAuthUserDto(user: Pick<User, "id" | "email">): AuthUserDto {
    return {
      id: user.id,
      email: user.email,
    };
  }
}
