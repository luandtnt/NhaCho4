import { PrismaService } from '../../modules/platform/prisma/prisma.service';

/**
 * Helper class to get party IDs for users
 * Used for data isolation (landlord/tenant)
 */
export class PartyHelper {
  /**
   * Get landlord party ID for a user
   * Returns null if user is not a landlord or party not found
   */
  static async getLandlordPartyId(
    prisma: PrismaService,
    userId: string,
    orgId: string,
  ): Promise<string | null> {
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, role: true },
    });

    console.log('[PartyHelper] getLandlordPartyId - userId:', userId, 'user:', user);

    if (!user) return null;

    // If not landlord, return null
    if (user.role !== 'Landlord') return null;

    // Find party by email (parties are linked to users via email)
    const party = await prisma.party.findFirst({
      where: {
        org_id: orgId,
        party_type: 'LANDLORD',
        email: user.email,
      },
      select: { id: true },
    });

    console.log('[PartyHelper] getLandlordPartyId - Found party:', party);

    return party?.id || null;
  }

  /**
   * Get tenant party ID for a user
   * Returns null if user is not a tenant or party not found
   */
  static async getTenantPartyId(
    prisma: PrismaService,
    userId: string,
    orgId: string,
  ): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, role: true },
    });

    if (!user) return null;
    if (user.role !== 'Tenant') return null;

    const party = await prisma.party.findFirst({
      where: {
        org_id: orgId,
        party_type: 'TENANT',
        email: user.email,
      },
      select: { id: true },
    });

    return party?.id || null;
  }
}
