import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    // Create a fake copy of the users service
    const users: User[] = [];
    fakeUsersService = {
      find: (email: string) => {
        const filtredUsers = users.filter((user) => user.email === email);
        return Promise.resolve(filtredUsers);
      }, // Promise.resolve([]),
      create: (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random() * 999999),
          email,
          password,
        } as User;
        users.push(user);
        return Promise.resolve(user);
      },
      //  Promise.resolve({ id: 1, email, password } as User),
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: fakeUsersService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with a salted and hashed password', async () => {
    const user = await service.signup('asd@asdf.com', 'asdf');

    expect(user.password).not.toEqual('asdf');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if user signs up with email that is in use', async () => {
    fakeUsersService.find = () =>
      Promise.resolve([{ id: 1, email: 'a', password: '1' } as User]);
    await expect(service.signup('asdf@asdf.com', 'asdf')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throw if signin is called with an unused email', async () => {
    await expect(
      service.signin('asdflkj@asdflkj.com', 'passdflkj'),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws if an invalid password is provided', async () => {
    fakeUsersService.find = () =>
      Promise.resolve([{ email: 'asdf@asdf.com', password: 'sadasd' } as User]);
    await expect(
      service.signin('asdfl@asdasd.com', 'password'),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns a user if correct password is provided', async () => {
    await service.signup('asdf@asdf.com', 'mypassword');
    // fakeUsersService.find = () =>
    //   Promise.resolve([
    //     {
    //       email: 'asdasd@aaa.com',
    //       password:
    //         '03c812941d5aa6cb.0b88a01e52811e0ce1155c645c0e476a31908e9446bb1f1a2a7339af5a912ef1',
    //     } as User,
    //   ]);

    // await service.signup('asdf@asdf.com', 'mypassword');

    const user = await service.signin('asdf@asdf.com', 'mypassword');
    expect(user).toBeDefined();

    //Узнаем  каков же засоленый и захешированный пароль, если ввести 'mypassword'
    //И после вставляем это значение в строку где user
    // const user = await service.signup('asdasd@aaa.com', 'mypassword');
    // console.log(user);
  });
});
