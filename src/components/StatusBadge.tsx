import { STATUS } from '../lib/categories'
import type { Status } from '../types'
import Icon from './Icon'

export default function StatusBadge({ status, short = false }: { status: Status; short?: boolean }) {
  const s = STATUS[status]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-label-sm text-label-sm uppercase ${s.cls}`}>
      <Icon name={s.icon} fill className="!text-[14px]" />
      {short ? s.label.split(' ')[0] : s.label}
    </span>
  )
}
