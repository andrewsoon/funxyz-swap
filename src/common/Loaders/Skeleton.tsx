import "./Skeleton.css"

interface SkeletonProps {
  width?: string
  height?: string
}
const Skeleton: React.FC<SkeletonProps> = ({ width, height = "20px" }) => {
  return <div className="skeleton" style={{ width, height }} />
}

export default Skeleton