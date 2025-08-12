import { supabase } from '@/lib/supabase'
import { Memo, MemoFormData } from '@/types/memo'
import { Database } from '@/lib/supabase'

type MemoRow = Database['public']['Tables']['memos']['Row']
type MemoInsert = Database['public']['Tables']['memos']['Insert']
type MemoUpdate = Database['public']['Tables']['memos']['Update']

/**
 * 데이터베이스의 memo 테이블과 상호작용하는 유틸리티 함수들
 */
export const supabaseUtils = {
  /**
   * 모든 메모 가져오기 (최신순으로 정렬)
   */
  getMemos: async (): Promise<Memo[]> => {
    try {
      const { data, error } = await supabase
        .from('memos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching memos:', error)
        throw error
      }

      // null 값들을 기본값으로 변환
      return (data || []).map(memo => ({
        ...memo,
        tags: memo.tags || [],
        created_at: memo.created_at || new Date().toISOString(),
        updated_at: memo.updated_at || new Date().toISOString(),
      }))
    } catch (error) {
      console.error('Failed to get memos:', error)
      throw error
    }
  },

  /**
   * 새 메모 추가
   */
  addMemo: async (formData: MemoFormData): Promise<Memo> => {
    try {
      const memoData: MemoInsert = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        tags: formData.tags.length > 0 ? formData.tags : [],
      }

      const { data, error } = await supabase
        .from('memos')
        .insert(memoData)
        .select()
        .single()

      if (error) {
        console.error('Error adding memo:', error)
        throw error
      }

      if (!data) {
        throw new Error('메모 생성에 실패했습니다.')
      }

      // null 값들을 기본값으로 변환
      return {
        ...data,
        tags: data.tags || [],
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
      }
    } catch (error) {
      console.error('Failed to add memo:', error)
      throw error
    }
  },

  /**
   * 메모 업데이트
   */
  updateMemo: async (id: string, formData: MemoFormData): Promise<Memo> => {
    try {
      const updateData: MemoUpdate = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        tags: formData.tags.length > 0 ? formData.tags : [],
      }

      const { data, error } = await supabase
        .from('memos')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating memo:', error)
        throw error
      }

      if (!data) {
        throw new Error('메모 업데이트에 실패했습니다.')
      }

      // null 값들을 기본값으로 변환
      return {
        ...data,
        tags: data.tags || [],
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
      }
    } catch (error) {
      console.error('Failed to update memo:', error)
      throw error
    }
  },

  /**
   * 메모 삭제
   */
  deleteMemo: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('memos')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting memo:', error)
        throw error
      }
    } catch (error) {
      console.error('Failed to delete memo:', error)
      throw error
    }
  },

  /**
   * 특정 메모 가져오기
   */
  getMemoById: async (id: string): Promise<Memo | null> => {
    try {
      const { data, error } = await supabase
        .from('memos')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // 메모를 찾을 수 없음
          return null
        }
        console.error('Error fetching memo by ID:', error)
        throw error
      }

      return data ? {
        ...data,
        tags: data.tags || [],
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
      } : null
    } catch (error) {
      console.error('Failed to get memo by ID:', error)
      throw error
    }
  },

  /**
   * 카테고리별 메모 가져오기
   */
  getMemosByCategory: async (category: string): Promise<Memo[]> => {
    try {
      const { data, error } = await supabase
        .from('memos')
        .select('*')
        .eq('category', category)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching memos by category:', error)
        throw error
      }

      return (data || []).map(memo => ({
        ...memo,
        tags: memo.tags || [],
        created_at: memo.created_at || new Date().toISOString(),
        updated_at: memo.updated_at || new Date().toISOString(),
      }))
    } catch (error) {
      console.error('Failed to get memos by category:', error)
      throw error
    }
  },

  /**
   * 메모 검색 (제목, 내용, 태그 기준)
   */
  searchMemos: async (query: string): Promise<Memo[]> => {
    try {
      const searchTerm = `%${query.toLowerCase()}%`

      const { data, error } = await supabase
        .from('memos')
        .select('*')
        .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error searching memos:', error)
        throw error
      }

      // 클라이언트 사이드에서 태그 검색 추가 (Supabase에서 배열 검색이 복잡함)
      const filteredData = data?.filter(memo => 
        memo.tags?.some(tag => 
          tag.toLowerCase().includes(query.toLowerCase())
        )
      ) || []

      // 중복 제거 (제목/내용 매치와 태그 매치가 겹칠 수 있음)
      const uniqueData = data?.concat(filteredData).filter((memo, index, self) => 
        index === self.findIndex(m => m.id === memo.id)
      ) || []

      return uniqueData.map(memo => ({
        ...memo,
        tags: memo.tags || [],
        created_at: memo.created_at || new Date().toISOString(),
        updated_at: memo.updated_at || new Date().toISOString(),
      }))
    } catch (error) {
      console.error('Failed to search memos:', error)
      throw error
    }
  },

  /**
   * 모든 메모 삭제
   */
  clearAllMemos: async (): Promise<void> => {
    try {
      const { error } = await supabase
        .from('memos')
        .delete()
        .neq('id', '') // 모든 레코드 선택을 위한 조건

      if (error) {
        console.error('Error clearing all memos:', error)
        throw error
      }
    } catch (error) {
      console.error('Failed to clear all memos:', error)
      throw error
    }
  },
}