import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { userService } from '../services/UserService';
import { NotFoundError } from '../errors/AppError';

export const getAllUsers = async (req: AuthRequest, res: Response) => {
    const users = await userService.findAllDetailed();
    res.json(users);
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    await userService.delete(id);
    res.json({ message: 'User deleted successfully' });
};

export const updateUser = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name, email, role, isActive } = req.body;

    const user = await userService.update(id, {
        name,
        email,
        role,
        isActive
    });

    res.json(user);
};

