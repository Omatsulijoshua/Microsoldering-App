import { Controller, Post, Body, UnauthorizedException, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() body: any) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password credentials');
    }
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(
      body.name,
      body.email,
      body.password,
      body.role
    );
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh() {
    return { status: 'success', message: 'Token refresh successful' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout() {
    return { status: 'success', message: 'Logged out successfully' };
  }
}
