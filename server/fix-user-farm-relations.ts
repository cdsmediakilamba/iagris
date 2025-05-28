import { db } from './db';
import { users, farms, userFarms, userPermissions } from '@shared/schema';
import { SystemModule, AccessLevel, UserRole } from '@shared/schema';

async function createUserFarmRelations() {
  try {
    console.log('Creating user-farm relations...');

    // Get all users and farms
    const allUsers = await db.select().from(users);
    const allFarms = await db.select().from(farms);

    console.log(`Found ${allUsers.length} users and ${allFarms.length} farms`);

    // Clear existing relations to avoid duplicates
    await db.delete(userFarms);
    await db.delete(userPermissions);

    // Create relations for each user with each farm
    for (const user of allUsers) {
      for (const farm of allFarms) {
        // Determine role based on user type
        let role = 'member';
        if (user.role === UserRole.SUPER_ADMIN) {
          role = 'admin';
        } else if (user.role === UserRole.FARM_ADMIN) {
          role = 'admin';
        } else if (user.role === UserRole.EMPLOYEE) {
          role = 'member';
        }

        // Create user-farm relation
        const [userFarmRelation] = await db.insert(userFarms).values({
          userId: user.id,
          farmId: farm.id,
          role: role,
          createdAt: new Date()
        }).returning();

        console.log(`Created relation: User ${user.name} -> Farm ${farm.name} (${role})`);

        // Create basic permissions for the user in this farm
        const modules = [
          SystemModule.ANIMALS,
          SystemModule.CROPS,
          SystemModule.INVENTORY,
          SystemModule.TASKS,
          SystemModule.FINANCIAL,
          SystemModule.GOALS,
          SystemModule.ADMINISTRATION
        ];

        for (const module of modules) {
          let accessLevel = AccessLevel.READ_ONLY;
          
          // Super admins and farm admins get full access
          if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.FARM_ADMIN) {
            accessLevel = AccessLevel.FULL;
          }

          await db.insert(userPermissions).values({
            userId: user.id,
            farmId: farm.id,
            module: module,
            accessLevel: accessLevel,
            createdAt: new Date()
          });
        }

        console.log(`Created permissions for User ${user.name} in Farm ${farm.name}`);
      }
    }

    console.log('User-farm relations created successfully!');
  } catch (error) {
    console.error('Error creating user-farm relations:', error);
  }
}

// Execute the function
createUserFarmRelations()
  .then(() => {
    console.log('Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });

export { createUserFarmRelations };