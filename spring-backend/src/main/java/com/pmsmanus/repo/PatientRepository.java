package com.pmsmanus.repo;

import com.pmsmanus.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Integer> {
    Optional<Patient> findByPatientId(String patientId);

    @Query("SELECT p FROM Patient p WHERE " +
            "LOWER(p.firstName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(p.lastName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(p.phone) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(p.email) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "ORDER BY p.createdAt DESC")
    List<Patient> search(String query);
}
