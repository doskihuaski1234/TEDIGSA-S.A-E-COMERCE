const MINIMUM_JWT_SECRET_LENGTH = 32;

export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < MINIMUM_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be configured with at least ${MINIMUM_JWT_SECRET_LENGTH} characters`
    );
  }

  return secret;
};
