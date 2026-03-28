import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";

import { CurrentUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { AuthUserDto } from "./dto/auth-user.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(@Body() registerDto: RegisterDto): Promise<AuthUserDto> {
    return this.authService.register(registerDto);
  }

  @Post("login")
  @HttpCode(200)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthUserDto> {
    const result = await this.authService.login(loginDto);

    response.cookie("access_token", result.accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
    });

    return result.user;
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() currentUser: AuthUserDto): AuthUserDto {
    return currentUser;
  }

  @Post("logout")
  @HttpCode(200)
  logout(@Res({ passthrough: true }) response: Response): { success: true } {
    response.clearCookie("access_token", {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
    });

    return { success: true };
  }
}
