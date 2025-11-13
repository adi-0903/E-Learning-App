import { useAnnouncementStore } from '@/store/announcementStore';
import { useAuthStore } from '@/store/authStore';
import { useCourseStore } from '@/store/courseStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Card, FAB, Searchbar, Text } from 'react-native-paper';

function AnnouncementsScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const { announcements, isLoading, fetchCourseAnnouncements, fetchSchoolAnnouncements, fetchSubjectAnnouncements, fetchAllAnnouncements, deleteAnnouncement } = useAnnouncementStore();
  const { courses } = useCourseStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'school' | 'subject'>('all');

  useEffect(() => {
    // Fetch announcements based on selected filter
    if (selectedFilter === 'all') {
      fetchAllAnnouncements();
    } else if (selectedFilter === 'school') {
      fetchSchoolAnnouncements();
    } else if (selectedFilter === 'subject') {
      fetchSubjectAnnouncements();
    }
  }, [selectedFilter]);

  useEffect(() => {
    // Default to showing all announcements
    if (!selectedFilter) {
      setSelectedFilter('all');
    }
  }, []);

  const filteredAnnouncements = announcements.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteAnnouncement = (announcementId: number, title: string) => {
    Alert.alert(
      'Delete Announcement',
      `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAnnouncement(announcementId);
              // Refresh the announcements list
              if (selectedFilter === 'all') {
                fetchAllAnnouncements();
              } else if (selectedFilter === 'school') {
                fetchSchoolAnnouncements();
              } else if (selectedFilter === 'subject') {
                fetchSubjectAnnouncements();
              }
              Alert.alert('Success', 'Announcement deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete announcement');
            }
          },
        },
      ]
    );
  };

  const renderAnnouncementItem = (announcement: any) => {
    const isSchoolWide = announcement.courseId === null;
    const courseName = isSchoolWide ? null : courses.find(c => c.id === announcement.courseId)?.title;
    
    return (
      <Card key={announcement.id} style={styles.announcementCard}>
        <Card.Content>
          <View style={styles.announcementHeader}>
            <View style={styles.announcementTitleContainer}>
              <Text style={styles.announcementTitle} numberOfLines={2}>
                {announcement.title}
              </Text>
              <View style={styles.announcementBadge}>
                <MaterialCommunityIcons 
                  name={isSchoolWide ? "school" : "book-open-page-variant"} 
                  size={12} 
                  color={isSchoolWide ? "#ff9800" : "#667eea"} 
                />
                <Text style={[styles.announcementBadgeText, { color: isSchoolWide ? "#ff9800" : "#667eea" }]}>
                  {isSchoolWide ? "School-wide" : courseName || "Course"}
                </Text>
              </View>
            </View>
            <View style={styles.announcementActions}>
              <Text style={styles.announcementDate}>
                {format(new Date(announcement.createdAt), 'MMM dd, yyyy')}
              </Text>
              {user?.role === 'teacher' && announcement.teacherId === user.id && (
                <TouchableOpacity
                  onPress={() => handleDeleteAnnouncement(announcement.id, announcement.title)}
                  style={styles.deleteButton}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color="#f44336" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          <Text style={styles.announcementContent} numberOfLines={3}>
            {announcement.content}
          </Text>
        </Card.Content>
      </Card>
    );
  };

  if (isLoading && announcements.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.premiumHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>📢 Announcements</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search announcements..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          placeholderTextColor="#999"
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterTab, selectedFilter === 'all' && styles.filterTabActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <MaterialCommunityIcons 
              name="view-dashboard" 
              size={16} 
              color={selectedFilter === 'all' ? '#fff' : '#667eea'} 
            />
            <Text style={[styles.filterTabText, selectedFilter === 'all' && styles.filterTabTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterTab, selectedFilter === 'school' && styles.filterTabActive]}
            onPress={() => setSelectedFilter('school')}
          >
            <MaterialCommunityIcons 
              name="school" 
              size={16} 
              color={selectedFilter === 'school' ? '#fff' : '#667eea'} 
            />
            <Text style={[styles.filterTabText, selectedFilter === 'school' && styles.filterTabTextActive]}>
              School-wide
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, selectedFilter === 'subject' && styles.filterTabActive]}
            onPress={() => setSelectedFilter('subject')}
          >
            <MaterialCommunityIcons 
              name="book-open-page-variant" 
              size={16} 
              color={selectedFilter === 'subject' ? '#fff' : '#667eea'} 
            />
            <Text style={[styles.filterTabText, selectedFilter === 'subject' && styles.filterTabTextActive]}>
              Subject
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <FlatList
        data={filteredAnnouncements}
        renderItem={({ item }) => renderAnnouncementItem(item)}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        scrollEnabled={filteredAnnouncements.length > 0}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="bell-off" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No announcements</Text>
          </View>
        }
      />

      {user?.role === 'teacher' && (
        <FAB
          icon="bell-plus"
          label="New Announcement"
          onPress={() => navigation.navigate('CreateAnnouncement')}
          style={styles.fab}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumHeader: {
    backgroundColor: '#667eea',
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    minHeight: 100,
  },
  headerContent: {
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  header: {
    backgroundColor: '#1976d2',
    padding: 20,
    paddingTop: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  courseSelector: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 4,
  },
  courseTab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  courseTabActive: {
    borderBottomColor: '#667eea',
  },
  courseTabText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '600',
  },
  courseTabTextActive: {
    color: '#667eea',
    fontWeight: '700',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchbar: {
    elevation: 2,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  announcementCard: {
    marginBottom: 16,
    elevation: 3,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  announcementHeader: {
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  announcementTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  announcementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    alignSelf: 'flex-start',
  },
  announcementBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  announcementDate: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  announcementContent: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingVertical: 12,
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f0f4ff',
    borderWidth: 2,
    borderColor: '#667eea',
    marginRight: 12,
    minWidth: 80,
  },
  filterTabActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#667eea',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  announcementActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  deleteButton: {
    padding: 4,
    borderRadius: 4,
  },
});

// Reusable Premium Header Component
const PremiumHeader = ({ title, badge }: any) => (
  <View style={styles.premiumHeader}>
    <View style={styles.headerContent}>
      <Text style={styles.greeting}>{badge} {title}</Text>
    </View>
  </View>
);

export default AnnouncementsScreen;
