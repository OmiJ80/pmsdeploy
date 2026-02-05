package com.pmsmanus.repo;

import com.pmsmanus.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Integer> {
    List<Prescription> findByPatientIdOrderByCreatedAtDesc(Integer patientId);
}
