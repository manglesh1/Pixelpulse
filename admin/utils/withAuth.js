import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

export function withAuth(handler) {
  return async (context) => {
    const { req } = context;
    const cookies = parse(req.headers.cookie || '');
    const token = cookies.adminToken;

    if (!token) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }

    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);

      const result = await handler({ ...context, user });
      return {
        ...result,
        props: {
          ...result.props,
          user,
        },
      };
    } catch (err) {
      return {
        redirect: {
          destination: '/login',
          permanent: false,
        },
      };
    }
  };
}
