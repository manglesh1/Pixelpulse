import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

export const withAuth =
  (allowedRoles, options = {}) =>
  (handler = async () => ({ props: {} })) =>
  async (context) => {
    const {
      onUnauthorized = '404', 
      cookieName = 'adminToken',
      passUserProp = true,
    } = options;

    const { req } = context;
    const cookies = parse(req.headers.cookie || '');
    const token = cookies[cookieName];

    const dest =
      onUnauthorized === '403'
        ? '/403'
        : onUnauthorized === 'login'
        ? '/login'
        : '/404';

    if (!token) {
      return { redirect: { destination: '/login', permanent: false } };
    }

    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);

      if (
        Array.isArray(allowedRoles) &&
        allowedRoles.length > 0 &&
        (!user?.role || !allowedRoles.includes(user.role))
      ) {
        return { redirect: { destination: dest, permanent: false } };
      }

      const result = (await handler({ ...context, user })) ?? { props: {} };
      const safeResult = typeof result === 'object' ? result : { props: {} };

      return {
        ...safeResult,
        props: {
          ...(safeResult.props || {}),
          ...(passUserProp ? { user } : {}),
        },
      };
    } catch {
      return { redirect: { destination: '/login', permanent: false } };
    }
  };
