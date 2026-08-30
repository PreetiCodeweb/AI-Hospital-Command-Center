from enum import Enum
from datetime import date, datetime
from sqlalchemy import Boolean, Date, DateTime, Enum as SAEnum, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base

class User(Base):
    __tablename__ = "app_users"
    id: Mapped[str] = mapped_column("user_id", primary_key=True, server_default="gen_random_uuid()")
    hospital_id: Mapped[str | None] = mapped_column(ForeignKey("hospitals.hospital_id"))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(160))
    role: Mapped[str] = mapped_column(String(40))
    password_hash: Mapped[str] = mapped_column(Text)
    hashed_password: Mapped[str] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )
    verification_token_hash: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
    )
    verification_token_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

class DepartmentType(str, Enum):
    ICU = "ICU"
    EMERGENCY = "EMERGENCY"
    WARD = "WARD"
    OPERATING_ROOM = "OPERATING_ROOM"
    ISOLATION = "ISOLATION"

class BedStatus(str, Enum):
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    CLEANING = "cleaning"
    MAINTENANCE = "maintenance"
    BLOCKED = "blocked"
    DISCHARGE_PENDING = "discharge_pending"

class Department(Base):
    __tablename__ = "departments"
    id: Mapped[str] = mapped_column("department_id", primary_key=True, server_default="gen_random_uuid()")
    hospital_id: Mapped[str] = mapped_column(ForeignKey("hospitals.hospital_id"))
    name: Mapped[str] = mapped_column(String(120))
    code: Mapped[str] = mapped_column(String(30))
    department_type: Mapped[DepartmentType] = mapped_column(SAEnum(DepartmentType, name="department_type", native_enum=True, create_type=False))
    type: Mapped[DepartmentType] = mapped_column(SAEnum(DepartmentType, name="department_type", native_enum=True, create_type=False))
    capacity: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    beds: Mapped[list["Bed"]] = relationship(back_populates="department")
    staff: Mapped[list["Staff"]] = relationship(back_populates="department")
    equipment: Mapped[list["Equipment"]] = relationship(back_populates="department")

class Bed(Base):
    __tablename__ = "beds"
    bed_id: Mapped[str] = mapped_column(primary_key=True, server_default="gen_random_uuid()")
    id: Mapped[str] = mapped_column("id", unique=True, nullable=False)
    department_id: Mapped[str] = mapped_column(ForeignKey("departments.department_id"))
    bed_number: Mapped[str] = mapped_column(String(20))
    bed_type: Mapped[str] = mapped_column(String(30))
    status: Mapped[BedStatus] = mapped_column(SAEnum(BedStatus, name="bed_status", native_enum=True, create_type=False), default=BedStatus.AVAILABLE)
    floor: Mapped[str | None] = mapped_column(String(20))
    department: Mapped[Department] = relationship(back_populates="beds")

class Staff(Base):
    __tablename__ = "staff"
    id: Mapped[str] = mapped_column("staff_id", primary_key=True, server_default="gen_random_uuid()")
    hospital_id: Mapped[str] = mapped_column(ForeignKey("hospitals.hospital_id"))
    department_id: Mapped[str | None] = mapped_column(ForeignKey("departments.department_id"))
    employee_code: Mapped[str] = mapped_column(String(40))
    full_name: Mapped[str] = mapped_column(String(160))
    staff_type: Mapped[str] = mapped_column(String(30))
    specialty: Mapped[str | None] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(30), default="active")
    on_shift: Mapped[bool] = mapped_column(Boolean, default=False)
    department: Mapped[Department | None] = relationship(back_populates="staff")

class Equipment(Base):
    __tablename__ = "equipment"
    id: Mapped[str] = mapped_column("equipment_id", primary_key=True, server_default="gen_random_uuid()")
    hospital_id: Mapped[str] = mapped_column(ForeignKey("hospitals.hospital_id"))
    department_id: Mapped[str | None] = mapped_column(ForeignKey("departments.department_id"))
    equipment_type_id: Mapped[str] = mapped_column(ForeignKey("equipment_types.equipment_type_id"))
    name: Mapped[str | None] = mapped_column(String(100))
    total_units: Mapped[int] = mapped_column(Integer, default=1)
    in_use_units: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(30), default="available")
    asset_tag: Mapped[str] = mapped_column(String(50))
    department: Mapped[Department | None] = relationship(back_populates="equipment")

class HistoricalMetric(Base):
    __tablename__ = "historical_metrics"
    id: Mapped[str] = mapped_column("metric_id", primary_key=True, server_default="gen_random_uuid()")
    department_type: Mapped[DepartmentType] = mapped_column(SAEnum(DepartmentType, name="department_type", native_enum=True, create_type=False), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    arrivals: Mapped[int] = mapped_column(Integer, default=0)
    admissions_count: Mapped[int] = mapped_column(Integer, default=0)
    occupied_beds: Mapped[int] = mapped_column(Integer, default=0)
    total_beds: Mapped[int] = mapped_column(Integer, default=0)
    staff_on_duty: Mapped[int] = mapped_column(Integer, default=0)
    equipment_in_use: Mapped[int] = mapped_column(Integer, default=0)
    equipment_total: Mapped[int] = mapped_column(Integer, default=0)
    day_of_week: Mapped[int] = mapped_column(Integer)
    hour_of_day: Mapped[int] = mapped_column(Integer)
    is_holiday: Mapped[bool] = mapped_column(Boolean, default=False)

class Alert(Base):
    __tablename__ = "alerts"
    id: Mapped[str] = mapped_column("alert_id", primary_key=True, server_default="gen_random_uuid()")
    hospital_id: Mapped[str] = mapped_column(ForeignKey("hospitals.hospital_id"))
    department_id: Mapped[str | None] = mapped_column(ForeignKey("departments.department_id"))
    alert_type: Mapped[str] = mapped_column(String(80))
    severity: Mapped[str] = mapped_column(String(30))
    status: Mapped[str] = mapped_column(String(30), default="open")
    title: Mapped[str] = mapped_column(String(180))
    message: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

class Hospital(Base):
    __tablename__ = "hospitals"
    id: Mapped[str] = mapped_column("hospital_id", primary_key=True)
    name: Mapped[str] = mapped_column(String(160))

class EquipmentType(Base):
    __tablename__ = "equipment_types"
    id: Mapped[str] = mapped_column("equipment_type_id", primary_key=True)
    name: Mapped[str] = mapped_column(String(100))

class Recommendation(Base):
    __tablename__ = "recommendations"
    id: Mapped[str] = mapped_column("recommendation_id", primary_key=True)
    hospital_id: Mapped[str] = mapped_column(ForeignKey("hospitals.hospital_id"))
    department_id: Mapped[str | None] = mapped_column(ForeignKey("departments.department_id"))
    title: Mapped[str] = mapped_column(String(180))
    action: Mapped[str] = mapped_column(Text)
    rationale: Mapped[str | None] = mapped_column(Text)
    priority: Mapped[int] = mapped_column(Integer, default=3)
    status: Mapped[str] = mapped_column(String(30), default="proposed")
