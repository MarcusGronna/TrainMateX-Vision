import { useQueryClient } from '@tanstack/react-query'
import { toast, type Id } from 'react-toastify'
import { useCallback } from 'react'

interface UseUndoableDeleteConfig<TCache, TItem> {
  /**
   * Query key for the cache to update
   */
  queryKey: readonly unknown[]
  /**
   * Function to execute the actual deletion (after delay)
   */
  deleteFn: (item: TItem) => Promise<void>
  /**
   * Function to update cache optimistically by removing the item
   */
  optimisticUpdate: (old: TCache | undefined, item: TItem) => TCache
  /**
   * Function to get a display label for the deleted item (shown in toast)
   */
  getItemLabel: (item: TItem) => string
  /**
   * Delay in milliseconds before executing the actual delete (default: 5000)
   */
  undoDurationMs?: number
}

/**
 * Generic hook for undoable delete operations with optimistic updates.
 *
 * Features:
 * - Optimistically removes item from cache immediately
 * - Shows toast with Undo button for configurable duration
 * - Executes actual deletion after delay
 * - Rolls back cache on undo or error
 *
 * @example
 * ```tsx
 * const deleteWorkout = useUndoableDelete({
 *   queryKey: workoutsKeys.list(programId),
 *   deleteFn: (workout) => deleteWorkoutMutation.mutateAsync(workout.id),
 *   optimisticUpdate: (old, workout) => old?.filter((w) => w.id !== workout.id) ?? [],
 *   getItemLabel: (workout) => workout.name,
 * })
 *
 * // Later in event handler...
 * <button onClick={() => deleteWorkout(workout)}>Delete</button>
 * ```
 */
export function useUndoableDelete<TCache = unknown, TItem = unknown>({
  queryKey,
  deleteFn,
  optimisticUpdate,
  getItemLabel,
  undoDurationMs = 5000,
}: UseUndoableDeleteConfig<TCache, TItem>) {
  const queryClient = useQueryClient()

  const executeDelete = useCallback(
    (item: TItem) => {
      // Store previous data for rollback
      const previousData = queryClient.getQueryData<TCache>(queryKey)

      // Optimistically update cache
      queryClient.setQueryData<TCache>(queryKey, (old) => {
        return optimisticUpdate(old, item)
      })

      let timeoutId: ReturnType<typeof setTimeout> | null = null
      let toastId: Id | null = null
      let isUndone = false

      const itemLabel = getItemLabel(item)

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
          autoClose: undoDurationMs,
          closeButton: false,
          onClose: () => {
            if (timeoutId) clearTimeout(timeoutId)
          },
        },
      )

      // Execute actual deletion after delay
      timeoutId = setTimeout(() => {
        if (!isUndone) {
          deleteFn(item)
            .then(() => {
              // Success - cache already updated optimistically
            })
            .catch((error) => {
              // Rollback on error
              rollback()

              const errorMessage =
                error instanceof Error ? error.message : 'Delete failed'
              toast.error(`Failed to delete ${itemLabel}: ${errorMessage}`)
            })
        }
      }, undoDurationMs)
    },
    [
      queryClient,
      queryKey,
      deleteFn,
      optimisticUpdate,
      getItemLabel,
      undoDurationMs,
    ],
  )

  return executeDelete
}
