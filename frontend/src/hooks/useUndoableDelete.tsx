import { useQueryClient } from '@tanstack/react-query'
import { toast, type Id } from 'react-toastify'
import { useCallback } from 'react'

interface UseUndoableDeleteOptions<TData> {
  /**
   * Query key for the cache to update
   */
  queryKey: readonly unknown[]
  /**
   * Function to execute the actual deletion (after delay)
   */
  deleteFn: () => Promise<void>
  /**
   * Function to filter out the deleted item from cache
   */
  optimisticUpdate: (oldData: TData) => TData
  /**
   * Label for the deleted item (shown in toast)
   */
  itemLabel: string
  /**
   * Delay in milliseconds before executing the actual delete (default: 5000)
   */
  delay?: number
  /**
   * Callback when deletion completes successfully
   */
  onSuccess?: () => void
  /**
   * Callback when deletion fails
   */
  onError?: (error: unknown) => void
}

/**
 * Generic hook for undoable delete operations with optimistic updates.
 *
 * Features:
 * - Optimistically removes item from cache immediately
 * - Shows toast with Undo button for 5 seconds
 * - Executes actual deletion after delay
 * - Rolls back cache on undo or error
 *
 * @example
 * ```tsx
 * const executeDelete = useUndoableDelete({
 *   queryKey: workoutsKeys.list(programId),
 *   deleteFn: () => deleteWorkoutMutation.mutateAsync(workoutId),
 *   optimisticUpdate: (old) => old?.filter((w) => w.id !== workoutId) ?? [],
 *   itemLabel: workout.name,
 *   onSuccess: () => navigate('/programs'),
 * })
 *
 * // Later...
 * executeDelete()
 * ```
 */
export function useUndoableDelete<TData = unknown>({
  queryKey,
  deleteFn,
  optimisticUpdate,
  itemLabel,
  delay = 5000,
  onSuccess,
  onError,
}: UseUndoableDeleteOptions<TData>) {
  const queryClient = useQueryClient()

  const executeDelete = useCallback(() => {
    // Store previous data for rollback
    const previousData = queryClient.getQueryData<TData>(queryKey)

    // Optimistically update cache
    queryClient.setQueryData<TData>(queryKey, (old) => {
      if (!old) return old
      return optimisticUpdate(old)
    })

    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let toastId: Id | null = null
    let isUndone = false

    // Rollback function
    const rollback = () => {
      queryClient.setQueryData(queryKey, previousData)
    }

    // Show undo toast
    toastId = toast.info(
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="text-gray-700">
          Deleted <strong>{itemLabel}</strong>
        </span>
        <button
          onClick={() => {
            isUndone = true
            if (timeoutId) clearTimeout(timeoutId)
            if (toastId) toast.dismiss(toastId)

            // Rollback optimistic update
            rollback()

            toast.success('Undo successful')
          }}
          className="shrink-0 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800 transition-colors"
          aria-label="Undo delete"
        >
          Undo
        </button>
      </div>,
      {
        autoClose: delay,
        closeButton: false,
        onClose: () => {
          if (timeoutId) clearTimeout(timeoutId)
        },
      },
    )

    // Execute actual deletion after delay
    timeoutId = setTimeout(() => {
      if (!isUndone) {
        deleteFn()
          .then(() => {
            onSuccess?.()
          })
          .catch((error) => {
            // Rollback on error
            rollback()
            onError?.(error)
          })
      }
    }, delay)
  }, [
    queryClient,
    queryKey,
    deleteFn,
    optimisticUpdate,
    itemLabel,
    delay,
    onSuccess,
    onError,
  ])

  return executeDelete
}
