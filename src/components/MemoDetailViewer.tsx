'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Memo, MEMO_CATEGORIES } from '@/types/memo'

// MDEditor.Markdown를 동적으로 import (SSR 문제 해결)
const MDEditorMarkdown = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => ({ default: mod.default.Markdown })),
  { ssr: false }
)

interface MemoDetailViewerProps {
  memo: Memo | null
  isOpen: boolean
  onClose: () => void
  onEdit: (memo: Memo) => void
  onDelete: (id: string) => Promise<void> | void
}

export default function MemoDetailViewer({
  memo,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}: MemoDetailViewerProps) {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey)
      // 모달 열릴 때 스크롤 방지
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
      // 모달 닫힐 때 스크롤 복원
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  // 모달이 닫혀있거나 메모가 없으면 렌더링하지 않음
  if (!isOpen || !memo) {
    return null
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      personal: 'bg-blue-100 text-blue-800 border-blue-200',
      work: 'bg-green-100 text-green-800 border-green-200',
      study: 'bg-purple-100 text-purple-800 border-purple-200',
      idea: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200',
    }
    return colors[category as keyof typeof colors] || colors.other
  }

  const handleBackgroundClick = (e: React.MouseEvent) => {
    // 배경 클릭 시에만 모달 닫기 (모달 내용 클릭 시에는 닫지 않음)
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleEdit = () => {
    onEdit(memo)
    onClose()
  }

  const handleDelete = async () => {
    if (window.confirm('정말로 이 메모를 삭제하시겠습니까?')) {
      try {
        await onDelete(memo.id)
        onClose()
      } catch (error) {
        console.error('메모 삭제 실패:', error)
        alert('메모 삭제에 실패했습니다. 다시 시도해주세요.')
      }
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackgroundClick}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex justify-between items-start p-6 border-b border-gray-200">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              {memo.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(memo.category)}`}
              >
                {MEMO_CATEGORIES[memo.category as keyof typeof MEMO_CATEGORIES] ||
                  memo.category}
              </span>
                              <span>작성일: {formatDate(memo.created_at)}</span>
                {memo.created_at !== memo.updated_at && (
                  <span>수정일: {formatDate(memo.updated_at)}</span>
              )}
            </div>
          </div>

          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="닫기 (ESC)"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 내용 - 마크다운 렌더링 */}
        <div className="p-6">
          <div className="prose max-w-none prose-lg">
            <MDEditorMarkdown 
              source={memo.content} 
              style={{ 
                backgroundColor: 'transparent',
                fontSize: '16px',
                lineHeight: '1.6'
              }}
            />
          </div>

          {/* 태그 */}
          {memo.tags.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-900 mb-3">태그</h3>
              <div className="flex gap-2 flex-wrap">
                {memo.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full border border-gray-200"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleEdit}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            편집
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            삭제
          </button>
        </div>
      </div>
    </div>
  )
}