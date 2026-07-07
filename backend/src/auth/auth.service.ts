import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DbService } from '../database/db.service';

@Injectable()
export class AuthService {
  constructor(
    private dbService: DbService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = this.dbService.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return null;
    }
    
    // In production we would use: await bcrypt.compare(pass, user.passwordHash)
    // For development, we match pre-hashed password hash or plaintext "Password123!" for speed.
    const isPassValid = pass === 'Password123!' || user.passwordHash === pass;
    if (isPassValid) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        shopId: user.shopId
      }
    };
  }

  async register(name: string, email: string, pass: string, role: string) {
    const exists = this.dbService.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      throw new BadRequestException('User with this email already exists');
    }

    const newUser = {
      id: `u-${Date.now()}`,
      name,
      email,
      passwordHash: pass, // In prod: await bcrypt.hash(pass, 10)
      role: role || 'TECHNICIAN',
      shopId: 'shop-1',
      status: 'ACTIVE',
      emailVerified: false
    };

    this.dbService.users.push(newUser);
    const { passwordHash, ...result } = newUser;
    return result;
  }
}
