import axios from 'axios';

const API = '/api/v1/astreintes';

export interface AstreinteUser { id: string; name: string; email: string; }
export interface AstreinteTeam { id: string; name: string; }

export interface Astreinte {
    id:         string;
    weekNumber: number;
    year:       number;
    startDate:  string;
    endDate:    string;
    phone:      string | null;
    notes:      string | null;
    teamId:     string;
    team:       AstreinteTeam;
    userId:     string;
    user:       AstreinteUser;
    createdAt:  string;
    updatedAt:  string;
}

export interface CreateAstreinteDto {
    teamId:     string;
    userId:     string;
    weekNumber: number;
    year:       number;
    startDate:  string;
    endDate:    string;
    phone?:     string;
    notes?:     string;
}

export interface UpdateAstreinteDto {
    userId?: string;
    phone?:  string | null;
    notes?:  string | null;
}

export const getCurrentAstreinte = async (teamId?: string): Promise<Astreinte | null> => {
    const params = teamId ? { teamId } : {};
    const { data } = await axios.get(`${API}/current`, { params });
    return data.data;
};

export const getAstreintes = async (year: number, teamId?: string): Promise<Astreinte[]> => {
    const params: Record<string, unknown> = { year };
    if (teamId) params.teamId = teamId;
    const { data } = await axios.get(API, { params });
    return data.data;
};

export const createAstreinte = async (dto: CreateAstreinteDto): Promise<Astreinte> => {
    const { data } = await axios.post(API, dto);
    return data.data;
};

export const updateAstreinte = async (id: string, dto: UpdateAstreinteDto): Promise<Astreinte> => {
    const { data } = await axios.patch(`${API}/${id}`, dto);
    return data.data;
};

export const deleteAstreinte = async (id: string): Promise<void> => {
    await axios.delete(`${API}/${id}`);
};
