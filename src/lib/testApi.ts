import { authFetch } from './authFetch';

/**
 * Groups API test function
 * Guruhlar APIni tekshirish uchun
 */
export const testGroupsAPI = async () => {
  try {
    console.log('🔍 Groups API test boshlanyapti...');
    
    // Test 1: Get all groups
    console.log('\n📋 Test 1: Barcha guruhlarni olish');
    const groupsResponse = await authFetch('/groups/', {
      method: 'GET',
    });
    
    if (groupsResponse.ok) {
      const groupsData = await groupsResponse.json();
      console.log('✅ Guruhlar muvaffaqiyatli yuklandi:', groupsData);
      
      // Test 2: Get specific group details if groups exist
      if (Array.isArray(groupsData) && groupsData.length > 0) {
        const firstGroup = groupsData[0];
        console.log('\n📍 Test 2: Birinchi guruhning tafsilotlari');
        console.log('Guruh ID:', firstGroup.id);
        
        const groupDetailResponse = await authFetch(`/groups/${firstGroup.id}/`, {
          method: 'GET',
        });
        
        if (groupDetailResponse.ok) {
          const groupDetail = await groupDetailResponse.json();
          console.log('✅ Guruh tafsilotlari:', groupDetail);
        } else {
          console.error('❌ Guruh tafsilotlarini olishda xato:', groupDetailResponse.status);
        }
      } else {
        console.log('⚠️ Guruhlar ro\'yxati bo\'sh');
      }
    } else {
      console.error('❌ Guruhlarni olishda xato:', groupsResponse.status);
    }
    
    console.log('\n✅ API test tugadi');
  } catch (error) {
    console.error('❌ API test xatosi:', error);
  }
};

/**
 * User's group test
 * Foydalanuvchining guruhini tekshirish
 */
export const testUserGroupAPI = async (userId: string) => {
  try {
    console.log(`🔍 User ${userId} ning guruhini tekshiryapti...`);
    
    const response = await authFetch(`/users/${userId}/`, {
      method: 'GET',
    });
    
    if (response.ok) {
      const user = await response.json();
      console.log('✅ Foydalanuvchi ma\'lumotlari:', user);
      console.log('Guruh:', user.group);
    } else {
      console.error('❌ Foydalanuvchini olishda xato:', response.status);
    }
  } catch (error) {
    console.error('❌ API test xatosi:', error);
  }
};
