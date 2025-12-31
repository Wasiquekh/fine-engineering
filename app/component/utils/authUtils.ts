import { jwtDecode } from 'jwt-decode';

export interface JwtPayload {
  exp: number; // Expiry time in seconds
}

export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    if (!decoded.exp) return true;

    const expiryTime = decoded.exp * 1000; // convert to ms
    return Date.now() >= expiryTime;
  } catch (error) {
    return true; // if token is invalid
  }
};
